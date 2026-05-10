'use client';
import { Modal, ModalBody, ModalContent, ModalTrigger } from '../ui/animated-modal';

import JoinUsForm from './JoinUsForm';

export function JoinUsModal() {
    return (
        <div className="flex items-center justify-center">
            <Modal>
                <ModalTrigger className="group/modal-btn z-10 mt-3 flex justify-center bg-black text-white dark:bg-white dark:text-black">
                    <span className="text-center transition duration-500">Join Now</span>
                </ModalTrigger>
                <ModalBody>
                    <ModalContent>
                        <JoinUsForm />
                    </ModalContent>
                </ModalBody>
            </Modal>
        </div>
    );
}
